// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_3d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform7_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform7 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform21_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform21 : texture_depth_2d;

struct renderStruct {
	nodeUniform2 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform8 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : f32,
	nodeUniform28 : f32,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform18 : mat4x4<f32>,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform24 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform3 : f32,
	nodeUniform4 : f32,
	nodeUniform6 : mat3x3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar2 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : vec2<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : vec4<f32>;
var<private> nodeVar18 : vec4<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec4<f32>;
var<private> nodeVar46 : vec4<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec4<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec2<f32>;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec2<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec2<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec2<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec2<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : f32;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : vec4<f32>;

// codes
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( v_positionWorld.x * 3.0 ), ( v_positionWorld.z * 3.0 ), ( render.nodeUniform2 * 0.35 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar1 = mix( vec3<f32>( 0.011612245176281512, 0.033104766565152086, 0.02955683443236377 ), vec3<f32>( 0.04373502925049377, 0.10224173307914941, 0.06480326668529614 ), ( ( nodeVar0 * 0.5 ) + 0.5 ) );
	DiffuseColor = vec4<f32>( nodeVar1, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform3 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform4;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar2 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( ( 0.12 + ( nodeVar0 * 0.05 ) ), 0.0525 ) + max( max( nodeVar2.x, nodeVar2.y ), nodeVar2.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform4 ) ) );
	EmissiveColor = ( nodeVar1 * vec3<f32>( 0.22 ) );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar3 = dot( normalView, positionViewDirection );
	nodeVar4 = textureSample( nodeUniform7, nodeUniform7_sampler, vec2<f32>( Roughness, clamp( nodeVar3, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar4;
	nodeVar5 = ( dfg.x + dfg.y );
	nodeVar6 = ( 1.0 / nodeVar5 );
	nodeVar7 = nodeVar6;
	nodeVar8 = ( nodeVar7 - 1.0 );
	nodeVar9 = ( SpecularColorBlended * vec3<f32>( nodeVar8 ) );
	nodeVar10 = ( nodeVar9 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar10;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar11 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar12 = ( nodeVar11 * 0.5 );
	nodeVar13 = ( nodeVar12 + 0.5 );
	nodeVar14 = mix( render.nodeUniform8, render.nodeUniform9, nodeVar13 );
	nodeVar15 = ( irradiance + nodeVar14 );
	irradiance = nodeVar15;
	nodeVar16 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar17 = vec4<f32>( nodeVar16, 0.0 );
	nodeVar18 = ( render.cameraViewMatrix * nodeVar17 );
	nodeVar19 = normalize( nodeVar18.xyz );
	nodeVar20 = nodeVar19;
	nodeVar21 = dot( normalView, nodeVar20 );
	nodeVar22 = ( vec3<f32>( clamp( nodeVar21, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar23 = nodeVar22;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar24 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar25 = ( nodeVar23 * nodeVar24 );
	nodeVar26 = ( nodeVar20 + positionViewDirection );
	nodeVar27 = normalize( nodeVar26 );
	nodeVar28 = dot( positionViewDirection, nodeVar27 );
	nodeVar29 = clamp( nodeVar28, 0.0, 1.0 );
	nodeVar30 = exp2( ( ( ( nodeVar29 * -5.55473 ) - 6.98316 ) * nodeVar29 ) );
	nodeVar31 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar30 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar30 ) ) );
	nodeVar32 = ( vec3<f32>( 1.0 ) - nodeVar31 );
	nodeVar33 = nodeVar32;
	nodeVar34 = ( nodeVar25 * nodeVar33 );
	nodeVar35 = ( directDiffuse + nodeVar34 );
	directDiffuse = nodeVar35;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar36 = normalize( ( nodeVar20 + positionViewDirection ) );
	nodeVar37 = clamp( dot( positionViewDirection, nodeVar36 ), 0.0, 1.0 );
	nodeVar38 = exp2( ( ( ( nodeVar37 * -5.55473 ) - 6.98316 ) * nodeVar37 ) );
	nodeVar39 = ( Roughness * Roughness );
	nodeVar40 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar38 ) ) ) + vec3<f32>( ( 1.0 * nodeVar38 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar39, clamp( dot( normalView, nodeVar20 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar39, clamp( dot( normalView, nodeVar36 ), 0.0, 1.0 ) ) ) );
	nodeVar41 = ( nodeVar23 * nodeVar40 );
	nodeVar42 = ( nodeVar41 * multiScatteringCompensation );
	nodeVar43 = ( directSpecular + nodeVar42 );
	directSpecular = nodeVar43;
	nodeVar44 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar45 = vec4<f32>( nodeVar44, 0.0 );
	nodeVar46 = ( render.cameraViewMatrix * nodeVar45 );
	nodeVar47 = normalize( nodeVar46.xyz );
	nodeVar48 = nodeVar47;
	nodeVar49 = dot( normalView, nodeVar48 );
	shadowPositionWorld = v_positionWorld;
	nodeVar51 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar52 = ( nodeVar51.xyz / vec3<f32>( nodeVar51.w ) );
	nodeVar53 = vec3<f32>( nodeVar52.x, ( 1.0 - nodeVar52.y ), ( nodeVar52.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar53.x >= 0.0 ) && ( nodeVar53.x <= 1.0 ) ) && ( nodeVar53.y >= 0.0 ) ) && ( nodeVar53.y <= 1.0 ) ) && ( nodeVar53.z <= 1.0 ) ) ) {

		nodeVar54 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar55 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar56 = ( nodeVar53.xy + ( vogelDiskSample( 0, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar57 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar56, nodeVar53.z );
		nodeVar58 = ( nodeVar53.xy + ( vogelDiskSample( 1, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar59 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar58, nodeVar53.z );
		nodeVar60 = ( nodeVar53.xy + ( vogelDiskSample( 2, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar61 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar60, nodeVar53.z );
		nodeVar62 = ( nodeVar53.xy + ( vogelDiskSample( 3, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar63 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar62, nodeVar53.z );
		nodeVar64 = ( nodeVar53.xy + ( vogelDiskSample( 4, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar65 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar64, nodeVar53.z );
		nodeVar50 = ( ( ( ( ( nodeVar57 + nodeVar59 ) + nodeVar61 ) + nodeVar63 ) + nodeVar65 ) * 0.2 );

	} else {

		nodeVar50 = 1.0;

	}

	nodeVar66 = mix( 1.0, nodeVar50, render.nodeUniform24 );
	nodeVar67 = ( vec3<f32>( clamp( nodeVar49, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar66 ) ) );
	nodeVar68 = nodeVar67;
	nodeVar69 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar70 = ( nodeVar68 * nodeVar69 );
	nodeVar71 = ( nodeVar48 + positionViewDirection );
	nodeVar72 = normalize( nodeVar71 );
	nodeVar73 = dot( positionViewDirection, nodeVar72 );
	nodeVar74 = clamp( nodeVar73, 0.0, 1.0 );
	nodeVar75 = exp2( ( ( ( nodeVar74 * -5.55473 ) - 6.98316 ) * nodeVar74 ) );
	nodeVar76 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar75 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar75 ) ) );
	nodeVar77 = ( vec3<f32>( 1.0 ) - nodeVar76 );
	nodeVar78 = nodeVar77;
	nodeVar79 = ( nodeVar70 * nodeVar78 );
	nodeVar80 = ( directDiffuse + nodeVar79 );
	directDiffuse = nodeVar80;
	nodeVar81 = normalize( ( nodeVar48 + positionViewDirection ) );
	nodeVar82 = clamp( dot( positionViewDirection, nodeVar81 ), 0.0, 1.0 );
	nodeVar83 = exp2( ( ( ( nodeVar82 * -5.55473 ) - 6.98316 ) * nodeVar82 ) );
	nodeVar84 = ( Roughness * Roughness );
	nodeVar85 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar83 ) ) ) + vec3<f32>( ( 1.0 * nodeVar83 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar84, clamp( dot( normalView, nodeVar48 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar84, clamp( dot( normalView, nodeVar81 ), 0.0, 1.0 ) ) ) );
	nodeVar86 = ( nodeVar68 * nodeVar85 );
	nodeVar87 = ( nodeVar86 * multiScatteringCompensation );
	nodeVar88 = ( directSpecular + nodeVar87 );
	directSpecular = nodeVar88;
	nodeVar89 = ( render.nodeUniform25 - v_positionView );
	nodeVar90 = normalize( nodeVar89 );
	nodeVar91 = dot( normalView, nodeVar90 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar93 = length( nodeVar89 );
		nodeVar94 = ( nodeVar93 / render.nodeUniform27 );
		nodeVar95 = clamp( ( 1.0 - ( ( ( nodeVar94 * nodeVar94 ) * nodeVar94 ) * nodeVar94 ) ), 0.0, 1.0 );
		nodeVar92 = ( ( 1.0 / max( pow( nodeVar93, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar95 * nodeVar95 ) );

	} else {

		nodeVar92 = ( 1.0 / max( pow( length( nodeVar89 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar96 = ( render.nodeUniform26 * vec3<f32>( nodeVar92 ) );
	nodeVar97 = ( vec3<f32>( clamp( nodeVar91, 0.0, 1.0 ) ) * nodeVar96 );
	nodeVar98 = nodeVar97;
	nodeVar99 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar100 = ( nodeVar98 * nodeVar99 );
	nodeVar101 = ( nodeVar90 + positionViewDirection );
	nodeVar102 = normalize( nodeVar101 );
	nodeVar103 = dot( positionViewDirection, nodeVar102 );
	nodeVar104 = clamp( nodeVar103, 0.0, 1.0 );
	nodeVar105 = exp2( ( ( ( nodeVar104 * -5.55473 ) - 6.98316 ) * nodeVar104 ) );
	nodeVar106 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar105 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar105 ) ) );
	nodeVar107 = ( vec3<f32>( 1.0 ) - nodeVar106 );
	nodeVar108 = nodeVar107;
	nodeVar109 = ( nodeVar100 * nodeVar108 );
	nodeVar110 = ( directDiffuse + nodeVar109 );
	directDiffuse = nodeVar110;
	nodeVar111 = normalize( ( nodeVar90 + positionViewDirection ) );
	nodeVar112 = clamp( dot( positionViewDirection, nodeVar111 ), 0.0, 1.0 );
	nodeVar113 = exp2( ( ( ( nodeVar112 * -5.55473 ) - 6.98316 ) * nodeVar112 ) );
	nodeVar114 = ( Roughness * Roughness );
	nodeVar115 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar113 ) ) ) + vec3<f32>( ( 1.0 * nodeVar113 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar114, clamp( dot( normalView, nodeVar90 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar114, clamp( dot( normalView, nodeVar111 ), 0.0, 1.0 ) ) ) );
	nodeVar116 = ( nodeVar98 * nodeVar115 );
	nodeVar117 = ( nodeVar116 * multiScatteringCompensation );
	nodeVar118 = ( directSpecular + nodeVar117 );
	directSpecular = nodeVar118;
	nodeVar119 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar120 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar121 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar122 = ( SpecularF90 * dfg.y );
	nodeVar123 = ( nodeVar121 + vec3<f32>( nodeVar122 ) );
	nodeVar124 = ( nodeVar119 + nodeVar123 );
	nodeVar119 = nodeVar124;
	nodeVar125 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar126 = nodeVar125;
	nodeVar127 = ( nodeVar126 * vec3<f32>( 0.047619 ) );
	nodeVar128 = ( SpecularColor + nodeVar127 );
	nodeVar129 = ( nodeVar123 * nodeVar128 );
	nodeVar130 = ( dfg.x + dfg.y );
	nodeVar131 = ( 1.0 - nodeVar130 );
	nodeVar132 = nodeVar131;
	nodeVar133 = ( vec3<f32>( nodeVar132 ) * nodeVar128 );
	nodeVar134 = ( vec3<f32>( 1.0 ) - nodeVar133 );
	nodeVar135 = nodeVar134;
	nodeVar136 = ( nodeVar129 / nodeVar135 );
	nodeVar137 = ( nodeVar136 * vec3<f32>( nodeVar132 ) );
	nodeVar138 = ( nodeVar120 + nodeVar137 );
	nodeVar120 = nodeVar138;
	nodeVar139 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar140 = ( irradiance * nodeVar139 );
	nodeVar141 = ( nodeVar119 + nodeVar120 );
	nodeVar142 = ( vec3<f32>( 1.0 ) - nodeVar141 );
	nodeVar143 = nodeVar142;
	nodeVar144 = ( nodeVar140 * nodeVar143 );
	nodeVar145 = nodeVar144;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar146 = ( indirectDiffuse + nodeVar145 );
	indirectDiffuse = nodeVar146;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar147 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar148 = ( SpecularF90 * dfg.y );
	nodeVar149 = ( nodeVar147 + vec3<f32>( nodeVar148 ) );
	nodeVar150 = ( singleScatteringDielectric + nodeVar149 );
	singleScatteringDielectric = nodeVar150;
	nodeVar151 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar152 = nodeVar151;
	nodeVar153 = ( nodeVar152 * vec3<f32>( 0.047619 ) );
	nodeVar154 = ( SpecularColor + nodeVar153 );
	nodeVar155 = ( nodeVar149 * nodeVar154 );
	nodeVar156 = ( dfg.x + dfg.y );
	nodeVar157 = ( 1.0 - nodeVar156 );
	nodeVar158 = nodeVar157;
	nodeVar159 = ( vec3<f32>( nodeVar158 ) * nodeVar154 );
	nodeVar160 = ( vec3<f32>( 1.0 ) - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( nodeVar155 / nodeVar161 );
	nodeVar163 = ( nodeVar162 * vec3<f32>( nodeVar158 ) );
	nodeVar164 = ( multiScatteringDielectric + nodeVar163 );
	multiScatteringDielectric = nodeVar164;
	nodeVar165 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar166 = ( SpecularF90 * dfg.y );
	nodeVar167 = ( nodeVar165 + vec3<f32>( nodeVar166 ) );
	nodeVar168 = ( singleScatteringMetallic + nodeVar167 );
	singleScatteringMetallic = nodeVar168;
	nodeVar169 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( nodeVar170 * vec3<f32>( 0.047619 ) );
	nodeVar172 = ( DiffuseColor.xyz + nodeVar171 );
	nodeVar173 = ( nodeVar167 * nodeVar172 );
	nodeVar174 = ( dfg.x + dfg.y );
	nodeVar175 = ( 1.0 - nodeVar174 );
	nodeVar176 = nodeVar175;
	nodeVar177 = ( vec3<f32>( nodeVar176 ) * nodeVar172 );
	nodeVar178 = ( vec3<f32>( 1.0 ) - nodeVar177 );
	nodeVar179 = nodeVar178;
	nodeVar180 = ( nodeVar173 / nodeVar179 );
	nodeVar181 = ( nodeVar180 * vec3<f32>( nodeVar176 ) );
	nodeVar182 = ( multiScatteringMetallic + nodeVar181 );
	multiScatteringMetallic = nodeVar182;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar183 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar184 = ( radiance * nodeVar183 );
	nodeVar185 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar186 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar187 = ( nodeVar185 * nodeVar186 );
	nodeVar188 = ( nodeVar184 + nodeVar187 );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar191 = ( vec3<f32>( 1.0 ) - nodeVar190 );
	nodeVar192 = nodeVar191;
	nodeVar193 = ( DiffuseContribution * nodeVar192 );
	nodeVar194 = ( nodeVar193 * nodeVar186 );
	nodeVar195 = nodeVar194;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar196 = ( indirectSpecular + nodeVar189 );
	indirectSpecular = nodeVar196;
	nodeVar197 = ( indirectDiffuse + nodeVar195 );
	indirectDiffuse = nodeVar197;
	ambientOcclusion = 1.0;
	nodeVar198 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar198;
	nodeVar199 = dot( normalView, positionViewDirection );
	nodeVar200 = ( clamp( nodeVar199, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar201 = ( Roughness * -16.0 );
	nodeVar202 = ( 1.0 - nodeVar201 );
	nodeVar203 = nodeVar202;
	nodeVar204 = ( - nodeVar203 );
	nodeVar205 = exp2( nodeVar204 );
	nodeVar206 = pow( nodeVar200, nodeVar205 );
	nodeVar207 = ( 1.0 - nodeVar206 );
	nodeVar208 = nodeVar207;
	nodeVar209 = ( ambientOcclusion - nodeVar208 );
	nodeVar210 = ( indirectSpecular * vec3<f32>( clamp( nodeVar209, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar210;
	nodeVar211 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar211;
	nodeVar212 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar212;
	nodeVar213 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar213;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar214 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar215 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar214 ) * nodeVar214 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar215;

	// result

	output.color = nodeVar215;

	return output;

}
