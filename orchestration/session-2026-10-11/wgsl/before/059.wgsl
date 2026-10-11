// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform8_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform8 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform23_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform23 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : vec3<f32>,
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform6 : vec3<f32>,
	nodeUniform7 : f32,
	nodeUniform9 : mat4x4<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform34 : vec3<f32>,
	nodeUniform35 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : f32,
	nodeUniform30 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform20 : mat4x4<f32>,
	nodeUniform21 : f32,
	nodeUniform22 : f32,
	nodeUniform26 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform24 : f32,
	nodeUniform25 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar0 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : vec2<f32>;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec3<f32>;
var<private> nodeVar8 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : vec3<f32>;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : vec4<f32>;
var<private> nodeVar16 : vec4<f32>;
var<private> nodeVar17 : vec3<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec4<f32>;
var<private> nodeVar44 : vec4<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec4<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec2<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec2<f32>;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec2<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec2<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec2<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
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
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : vec4<f32>;

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
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionViewDirection : vec3<f32>,
	@location( 3 ) v_positionWorld : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	DiffuseColor = vec4<f32>( object.nodeUniform0, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar0 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform3, 0.0525 ) + max( max( nodeVar0.x, nodeVar0.y ), nodeVar0.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	EmissiveColor = ( object.nodeUniform6 * vec3<f32>( object.nodeUniform7 ) );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar1 = dot( normalView, positionViewDirection );
	nodeVar2 = textureSample( nodeUniform8, nodeUniform8_sampler, vec2<f32>( Roughness, clamp( nodeVar1, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar2;
	nodeVar3 = ( dfg.x + dfg.y );
	nodeVar4 = ( 1.0 / nodeVar3 );
	nodeVar5 = nodeVar4;
	nodeVar6 = ( nodeVar5 - 1.0 );
	nodeVar7 = ( SpecularColorBlended * vec3<f32>( nodeVar6 ) );
	nodeVar8 = ( nodeVar7 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar8;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar9 = dot( normalWorld, normalize( render.nodeUniform13 ) );
	nodeVar10 = ( nodeVar9 * 0.5 );
	nodeVar11 = ( nodeVar10 + 0.5 );
	nodeVar12 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar11 );
	nodeVar13 = ( irradiance + nodeVar12 );
	irradiance = nodeVar13;
	nodeVar14 = ( render.nodeUniform14 - render.nodeUniform15 );
	nodeVar15 = vec4<f32>( nodeVar14, 0.0 );
	nodeVar16 = ( render.cameraViewMatrix * nodeVar15 );
	nodeVar17 = normalize( nodeVar16.xyz );
	nodeVar18 = nodeVar17;
	nodeVar19 = dot( normalView, nodeVar18 );
	nodeVar20 = ( vec3<f32>( clamp( nodeVar19, 0.0, 1.0 ) ) * render.nodeUniform16 );
	nodeVar21 = nodeVar20;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar22 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar23 = ( nodeVar21 * nodeVar22 );
	nodeVar24 = ( nodeVar18 + positionViewDirection );
	nodeVar25 = normalize( nodeVar24 );
	nodeVar26 = dot( positionViewDirection, nodeVar25 );
	nodeVar27 = clamp( nodeVar26, 0.0, 1.0 );
	nodeVar28 = exp2( ( ( ( nodeVar27 * -5.55473 ) - 6.98316 ) * nodeVar27 ) );
	nodeVar29 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar28 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar28 ) ) );
	nodeVar30 = ( vec3<f32>( 1.0 ) - nodeVar29 );
	nodeVar31 = nodeVar30;
	nodeVar32 = ( nodeVar23 * nodeVar31 );
	nodeVar33 = ( directDiffuse + nodeVar32 );
	directDiffuse = nodeVar33;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar34 = normalize( ( nodeVar18 + positionViewDirection ) );
	nodeVar35 = clamp( dot( positionViewDirection, nodeVar34 ), 0.0, 1.0 );
	nodeVar36 = exp2( ( ( ( nodeVar35 * -5.55473 ) - 6.98316 ) * nodeVar35 ) );
	nodeVar37 = ( Roughness * Roughness );
	nodeVar38 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar36 ) ) ) + vec3<f32>( ( 1.0 * nodeVar36 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar37, clamp( dot( normalView, nodeVar18 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar37, clamp( dot( normalView, nodeVar34 ), 0.0, 1.0 ) ) ) );
	nodeVar39 = ( nodeVar21 * nodeVar38 );
	nodeVar40 = ( nodeVar39 * multiScatteringCompensation );
	nodeVar41 = ( directSpecular + nodeVar40 );
	directSpecular = nodeVar41;
	nodeVar42 = ( render.nodeUniform17 - render.nodeUniform18 );
	nodeVar43 = vec4<f32>( nodeVar42, 0.0 );
	nodeVar44 = ( render.cameraViewMatrix * nodeVar43 );
	nodeVar45 = normalize( nodeVar44.xyz );
	nodeVar46 = nodeVar45;
	nodeVar47 = dot( normalView, nodeVar46 );
	shadowPositionWorld = v_positionWorld;
	nodeVar49 = ( render.nodeUniform20 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform21 ) ) ), 1.0 ) );
	nodeVar50 = ( nodeVar49.xyz / vec3<f32>( nodeVar49.w ) );
	nodeVar51 = vec3<f32>( nodeVar50.x, ( 1.0 - nodeVar50.y ), ( nodeVar50.z + render.nodeUniform22 ) );

	if ( ( ( ( ( ( nodeVar51.x >= 0.0 ) && ( nodeVar51.x <= 1.0 ) ) && ( nodeVar51.y >= 0.0 ) ) && ( nodeVar51.y <= 1.0 ) ) && ( nodeVar51.z <= 1.0 ) ) ) {

		nodeVar52 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar53 = ( render.nodeUniform24 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform25 ).x );
		nodeVar54 = ( nodeVar51.xy + ( vogelDiskSample( 0, 5, nodeVar52 ) * vec2<f32>( nodeVar53 ) ) );
		nodeVar55 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar54, nodeVar51.z );
		nodeVar56 = ( nodeVar51.xy + ( vogelDiskSample( 1, 5, nodeVar52 ) * vec2<f32>( nodeVar53 ) ) );
		nodeVar57 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar56, nodeVar51.z );
		nodeVar58 = ( nodeVar51.xy + ( vogelDiskSample( 2, 5, nodeVar52 ) * vec2<f32>( nodeVar53 ) ) );
		nodeVar59 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar58, nodeVar51.z );
		nodeVar60 = ( nodeVar51.xy + ( vogelDiskSample( 3, 5, nodeVar52 ) * vec2<f32>( nodeVar53 ) ) );
		nodeVar61 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar60, nodeVar51.z );
		nodeVar62 = ( nodeVar51.xy + ( vogelDiskSample( 4, 5, nodeVar52 ) * vec2<f32>( nodeVar53 ) ) );
		nodeVar63 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar62, nodeVar51.z );
		nodeVar48 = ( ( ( ( ( nodeVar55 + nodeVar57 ) + nodeVar59 ) + nodeVar61 ) + nodeVar63 ) * 0.2 );

	} else {

		nodeVar48 = 1.0;

	}

	nodeVar64 = mix( 1.0, nodeVar48, render.nodeUniform26 );
	nodeVar65 = ( vec3<f32>( clamp( nodeVar47, 0.0, 1.0 ) ) * ( render.nodeUniform19 * vec3<f32>( nodeVar64 ) ) );
	nodeVar66 = nodeVar65;
	nodeVar67 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar68 = ( nodeVar66 * nodeVar67 );
	nodeVar69 = ( nodeVar46 + positionViewDirection );
	nodeVar70 = normalize( nodeVar69 );
	nodeVar71 = dot( positionViewDirection, nodeVar70 );
	nodeVar72 = clamp( nodeVar71, 0.0, 1.0 );
	nodeVar73 = exp2( ( ( ( nodeVar72 * -5.55473 ) - 6.98316 ) * nodeVar72 ) );
	nodeVar74 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar73 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar73 ) ) );
	nodeVar75 = ( vec3<f32>( 1.0 ) - nodeVar74 );
	nodeVar76 = nodeVar75;
	nodeVar77 = ( nodeVar68 * nodeVar76 );
	nodeVar78 = ( directDiffuse + nodeVar77 );
	directDiffuse = nodeVar78;
	nodeVar79 = normalize( ( nodeVar46 + positionViewDirection ) );
	nodeVar80 = clamp( dot( positionViewDirection, nodeVar79 ), 0.0, 1.0 );
	nodeVar81 = exp2( ( ( ( nodeVar80 * -5.55473 ) - 6.98316 ) * nodeVar80 ) );
	nodeVar82 = ( Roughness * Roughness );
	nodeVar83 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar81 ) ) ) + vec3<f32>( ( 1.0 * nodeVar81 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar82, clamp( dot( normalView, nodeVar46 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar82, clamp( dot( normalView, nodeVar79 ), 0.0, 1.0 ) ) ) );
	nodeVar84 = ( nodeVar66 * nodeVar83 );
	nodeVar85 = ( nodeVar84 * multiScatteringCompensation );
	nodeVar86 = ( directSpecular + nodeVar85 );
	directSpecular = nodeVar86;
	nodeVar87 = ( render.nodeUniform27 - v_positionView );
	nodeVar88 = normalize( nodeVar87 );
	nodeVar89 = dot( normalView, nodeVar88 );

	if ( ( render.nodeUniform29 > 0.0 ) ) {

		nodeVar91 = length( nodeVar87 );
		nodeVar92 = ( nodeVar91 / render.nodeUniform29 );
		nodeVar93 = clamp( ( 1.0 - ( ( ( nodeVar92 * nodeVar92 ) * nodeVar92 ) * nodeVar92 ) ), 0.0, 1.0 );
		nodeVar90 = ( ( 1.0 / max( pow( nodeVar91, render.nodeUniform30 ), 0.01 ) ) * ( nodeVar93 * nodeVar93 ) );

	} else {

		nodeVar90 = ( 1.0 / max( pow( length( nodeVar87 ), render.nodeUniform30 ), 0.01 ) );

	}

	nodeVar94 = ( render.nodeUniform28 * vec3<f32>( nodeVar90 ) );
	nodeVar95 = ( vec3<f32>( clamp( nodeVar89, 0.0, 1.0 ) ) * nodeVar94 );
	nodeVar96 = nodeVar95;
	nodeVar97 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar98 = ( nodeVar96 * nodeVar97 );
	nodeVar99 = ( nodeVar88 + positionViewDirection );
	nodeVar100 = normalize( nodeVar99 );
	nodeVar101 = dot( positionViewDirection, nodeVar100 );
	nodeVar102 = clamp( nodeVar101, 0.0, 1.0 );
	nodeVar103 = exp2( ( ( ( nodeVar102 * -5.55473 ) - 6.98316 ) * nodeVar102 ) );
	nodeVar104 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar103 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar103 ) ) );
	nodeVar105 = ( vec3<f32>( 1.0 ) - nodeVar104 );
	nodeVar106 = nodeVar105;
	nodeVar107 = ( nodeVar98 * nodeVar106 );
	nodeVar108 = ( directDiffuse + nodeVar107 );
	directDiffuse = nodeVar108;
	nodeVar109 = normalize( ( nodeVar88 + positionViewDirection ) );
	nodeVar110 = clamp( dot( positionViewDirection, nodeVar109 ), 0.0, 1.0 );
	nodeVar111 = exp2( ( ( ( nodeVar110 * -5.55473 ) - 6.98316 ) * nodeVar110 ) );
	nodeVar112 = ( Roughness * Roughness );
	nodeVar113 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar111 ) ) ) + vec3<f32>( ( 1.0 * nodeVar111 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar112, clamp( dot( normalView, nodeVar88 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar112, clamp( dot( normalView, nodeVar109 ), 0.0, 1.0 ) ) ) );
	nodeVar114 = ( nodeVar96 * nodeVar113 );
	nodeVar115 = ( nodeVar114 * multiScatteringCompensation );
	nodeVar116 = ( directSpecular + nodeVar115 );
	directSpecular = nodeVar116;
	nodeVar117 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar118 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar119 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar120 = ( SpecularF90 * dfg.y );
	nodeVar121 = ( nodeVar119 + vec3<f32>( nodeVar120 ) );
	nodeVar122 = ( nodeVar117 + nodeVar121 );
	nodeVar117 = nodeVar122;
	nodeVar123 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar124 = nodeVar123;
	nodeVar125 = ( nodeVar124 * vec3<f32>( 0.047619 ) );
	nodeVar126 = ( SpecularColor + nodeVar125 );
	nodeVar127 = ( nodeVar121 * nodeVar126 );
	nodeVar128 = ( dfg.x + dfg.y );
	nodeVar129 = ( 1.0 - nodeVar128 );
	nodeVar130 = nodeVar129;
	nodeVar131 = ( vec3<f32>( nodeVar130 ) * nodeVar126 );
	nodeVar132 = ( vec3<f32>( 1.0 ) - nodeVar131 );
	nodeVar133 = nodeVar132;
	nodeVar134 = ( nodeVar127 / nodeVar133 );
	nodeVar135 = ( nodeVar134 * vec3<f32>( nodeVar130 ) );
	nodeVar136 = ( nodeVar118 + nodeVar135 );
	nodeVar118 = nodeVar136;
	nodeVar137 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar138 = ( irradiance * nodeVar137 );
	nodeVar139 = ( nodeVar117 + nodeVar118 );
	nodeVar140 = ( vec3<f32>( 1.0 ) - nodeVar139 );
	nodeVar141 = nodeVar140;
	nodeVar142 = ( nodeVar138 * nodeVar141 );
	nodeVar143 = nodeVar142;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar144 = ( indirectDiffuse + nodeVar143 );
	indirectDiffuse = nodeVar144;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar145 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar146 = ( SpecularF90 * dfg.y );
	nodeVar147 = ( nodeVar145 + vec3<f32>( nodeVar146 ) );
	nodeVar148 = ( singleScatteringDielectric + nodeVar147 );
	singleScatteringDielectric = nodeVar148;
	nodeVar149 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar150 = nodeVar149;
	nodeVar151 = ( nodeVar150 * vec3<f32>( 0.047619 ) );
	nodeVar152 = ( SpecularColor + nodeVar151 );
	nodeVar153 = ( nodeVar147 * nodeVar152 );
	nodeVar154 = ( dfg.x + dfg.y );
	nodeVar155 = ( 1.0 - nodeVar154 );
	nodeVar156 = nodeVar155;
	nodeVar157 = ( vec3<f32>( nodeVar156 ) * nodeVar152 );
	nodeVar158 = ( vec3<f32>( 1.0 ) - nodeVar157 );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( nodeVar153 / nodeVar159 );
	nodeVar161 = ( nodeVar160 * vec3<f32>( nodeVar156 ) );
	nodeVar162 = ( multiScatteringDielectric + nodeVar161 );
	multiScatteringDielectric = nodeVar162;
	nodeVar163 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar164 = ( SpecularF90 * dfg.y );
	nodeVar165 = ( nodeVar163 + vec3<f32>( nodeVar164 ) );
	nodeVar166 = ( singleScatteringMetallic + nodeVar165 );
	singleScatteringMetallic = nodeVar166;
	nodeVar167 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar168 = nodeVar167;
	nodeVar169 = ( nodeVar168 * vec3<f32>( 0.047619 ) );
	nodeVar170 = ( DiffuseColor.xyz + nodeVar169 );
	nodeVar171 = ( nodeVar165 * nodeVar170 );
	nodeVar172 = ( dfg.x + dfg.y );
	nodeVar173 = ( 1.0 - nodeVar172 );
	nodeVar174 = nodeVar173;
	nodeVar175 = ( vec3<f32>( nodeVar174 ) * nodeVar170 );
	nodeVar176 = ( vec3<f32>( 1.0 ) - nodeVar175 );
	nodeVar177 = nodeVar176;
	nodeVar178 = ( nodeVar171 / nodeVar177 );
	nodeVar179 = ( nodeVar178 * vec3<f32>( nodeVar174 ) );
	nodeVar180 = ( multiScatteringMetallic + nodeVar179 );
	multiScatteringMetallic = nodeVar180;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar181 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar182 = ( radiance * nodeVar181 );
	nodeVar183 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar184 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar185 = ( nodeVar183 * nodeVar184 );
	nodeVar186 = ( nodeVar182 + nodeVar185 );
	nodeVar187 = nodeVar186;
	nodeVar188 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar189 = ( vec3<f32>( 1.0 ) - nodeVar188 );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( DiffuseContribution * nodeVar190 );
	nodeVar192 = ( nodeVar191 * nodeVar184 );
	nodeVar193 = nodeVar192;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar194 = ( indirectSpecular + nodeVar187 );
	indirectSpecular = nodeVar194;
	nodeVar195 = ( indirectDiffuse + nodeVar193 );
	indirectDiffuse = nodeVar195;
	ambientOcclusion = 1.0;
	nodeVar196 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar196;
	nodeVar197 = dot( normalView, positionViewDirection );
	nodeVar198 = ( clamp( nodeVar197, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar199 = ( Roughness * -16.0 );
	nodeVar200 = ( 1.0 - nodeVar199 );
	nodeVar201 = nodeVar200;
	nodeVar202 = ( - nodeVar201 );
	nodeVar203 = exp2( nodeVar202 );
	nodeVar204 = pow( nodeVar198, nodeVar203 );
	nodeVar205 = ( 1.0 - nodeVar204 );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( ambientOcclusion - nodeVar206 );
	nodeVar208 = ( indirectSpecular * vec3<f32>( clamp( nodeVar207, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar208;
	nodeVar209 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar209;
	nodeVar210 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar210;
	nodeVar211 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar211;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar212 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar213 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform31, object.nodeUniform32, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform34 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform35 * object.nodeUniform35 ) * nodeVar212 ) * nodeVar212 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar213;

	// result

	output.color = nodeVar213;

	return output;

}
