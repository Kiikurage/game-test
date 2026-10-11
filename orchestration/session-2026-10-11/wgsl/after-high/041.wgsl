// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform9_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform9 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform24_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform24 : texture_depth_2d;

struct objectStruct {
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform4 : f32,
	nodeUniform6 : mat3x3<f32>,
	nodeUniform7 : vec3<f32>,
	nodeUniform8 : f32,
	nodeUniform10 : mat4x4<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform36 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform1 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : f32,
	nodeUniform31 : f32,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform21 : mat4x4<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : f32,
	nodeUniform27 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform26 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar3 : u32;
var<private> nodeVar4 : u32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar5 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec2<f32>;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : vec3<f32>;
var<private> nodeVar13 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : vec3<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> nodeVar20 : vec4<f32>;
var<private> nodeVar21 : vec4<f32>;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec4<f32>;
var<private> nodeVar49 : vec4<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec4<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec2<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec2<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec2<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec2<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec2<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
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
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : f32;
var<private> nodeVar179 : f32;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : f32;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : vec4<f32>;

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
fn main( @location( 0 ) positionLocal : vec3<f32>,
	@location( 1 ) v_positionView : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) v_positionWorld : vec3<f32>,
	@location( 5 ) @interpolate(flat, either) nodeVarying7 : u32,
	@builtin( front_facing ) isFront : bool,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar3 = ( ( ( nodeVarying7 + 7u ) * 747796405u ) + 2891336453u );
	nodeVar4 = ( ( ( nodeVar3 >> ( ( nodeVar3 >> 28u ) + 4u ) ) ^ nodeVar3 ) * 277803737u );
	DiffuseColor = vec4<f32>( ( mix( vec3<f32>( 0.0069954101845983935, 0.005605391621829108, 0.0030352698352941175 ), vec3<f32>( 0.10702310296918527, 0.08437621153575764, 0.033104766565152086 ), smoothstep( 0.0, 0.5, positionLocal.y ) ) * vec3<f32>( ( ( ( f32( ( ( nodeVar4 >> 22u ) ^ nodeVar4 ) ) * 2.3283064365386963e-10 ) * 0.7 ) + 0.6 ) ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar5 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform4, 0.0525 ) + max( max( nodeVar5.x, nodeVar5.y ), nodeVar5.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	EmissiveColor = ( object.nodeUniform7 * vec3<f32>( object.nodeUniform8 ) );
	NORMAL_normalView = ( normalViewGeometry * vec3<f32>( ( ( f32( isFront ) * 2.0 ) - 1.0 ) ) );
	normalView = NORMAL_normalView;
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar6 = dot( normalView, positionViewDirection );
	nodeVar7 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar6, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar7;
	nodeVar8 = ( dfg.x + dfg.y );
	nodeVar9 = ( 1.0 / nodeVar8 );
	nodeVar10 = nodeVar9;
	nodeVar11 = ( nodeVar10 - 1.0 );
	nodeVar12 = ( SpecularColorBlended * vec3<f32>( nodeVar11 ) );
	nodeVar13 = ( nodeVar12 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar13;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar14 = dot( normalWorld, normalize( render.nodeUniform14 ) );
	nodeVar15 = ( nodeVar14 * 0.5 );
	nodeVar16 = ( nodeVar15 + 0.5 );
	nodeVar17 = mix( render.nodeUniform11, render.nodeUniform12, nodeVar16 );
	nodeVar18 = ( irradiance + nodeVar17 );
	irradiance = nodeVar18;
	nodeVar19 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar20 = vec4<f32>( nodeVar19, 0.0 );
	nodeVar21 = ( render.cameraViewMatrix * nodeVar20 );
	nodeVar22 = normalize( nodeVar21.xyz );
	nodeVar23 = nodeVar22;
	nodeVar24 = dot( normalView, nodeVar23 );
	nodeVar25 = ( vec3<f32>( clamp( nodeVar24, 0.0, 1.0 ) ) * render.nodeUniform17 );
	nodeVar26 = nodeVar25;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar27 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar28 = ( nodeVar26 * nodeVar27 );
	nodeVar29 = ( nodeVar23 + positionViewDirection );
	nodeVar30 = normalize( nodeVar29 );
	nodeVar31 = dot( positionViewDirection, nodeVar30 );
	nodeVar32 = clamp( nodeVar31, 0.0, 1.0 );
	nodeVar33 = exp2( ( ( ( nodeVar32 * -5.55473 ) - 6.98316 ) * nodeVar32 ) );
	nodeVar34 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar33 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar33 ) ) );
	nodeVar35 = ( vec3<f32>( 1.0 ) - nodeVar34 );
	nodeVar36 = nodeVar35;
	nodeVar37 = ( nodeVar28 * nodeVar36 );
	nodeVar38 = ( directDiffuse + nodeVar37 );
	directDiffuse = nodeVar38;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar39 = normalize( ( nodeVar23 + positionViewDirection ) );
	nodeVar40 = clamp( dot( positionViewDirection, nodeVar39 ), 0.0, 1.0 );
	nodeVar41 = exp2( ( ( ( nodeVar40 * -5.55473 ) - 6.98316 ) * nodeVar40 ) );
	nodeVar42 = ( Roughness * Roughness );
	nodeVar43 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar41 ) ) ) + vec3<f32>( ( 1.0 * nodeVar41 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar42, clamp( dot( normalView, nodeVar23 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar42, clamp( dot( normalView, nodeVar39 ), 0.0, 1.0 ) ) ) );
	nodeVar44 = ( nodeVar26 * nodeVar43 );
	nodeVar45 = ( nodeVar44 * multiScatteringCompensation );
	nodeVar46 = ( directSpecular + nodeVar45 );
	directSpecular = nodeVar46;
	nodeVar47 = ( render.nodeUniform18 - render.nodeUniform19 );
	nodeVar48 = vec4<f32>( nodeVar47, 0.0 );
	nodeVar49 = ( render.cameraViewMatrix * nodeVar48 );
	nodeVar50 = normalize( nodeVar49.xyz );
	nodeVar51 = nodeVar50;
	nodeVar52 = dot( normalView, nodeVar51 );
	shadowPositionWorld = v_positionWorld;
	nodeVar54 = ( render.nodeUniform21 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform22 ) ) ), 1.0 ) );
	nodeVar55 = ( nodeVar54.xyz / vec3<f32>( nodeVar54.w ) );
	nodeVar56 = vec3<f32>( nodeVar55.x, ( 1.0 - nodeVar55.y ), ( nodeVar55.z + render.nodeUniform23 ) );

	if ( ( ( ( ( ( nodeVar56.x >= 0.0 ) && ( nodeVar56.x <= 1.0 ) ) && ( nodeVar56.y >= 0.0 ) ) && ( nodeVar56.y <= 1.0 ) ) && ( nodeVar56.z <= 1.0 ) ) ) {

		nodeVar57 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar58 = ( render.nodeUniform25 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform26 ).x );
		nodeVar59 = ( nodeVar56.xy + ( vogelDiskSample( 0, 5, nodeVar57 ) * vec2<f32>( nodeVar58 ) ) );
		nodeVar60 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar59, nodeVar56.z );
		nodeVar61 = ( nodeVar56.xy + ( vogelDiskSample( 1, 5, nodeVar57 ) * vec2<f32>( nodeVar58 ) ) );
		nodeVar62 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar61, nodeVar56.z );
		nodeVar63 = ( nodeVar56.xy + ( vogelDiskSample( 2, 5, nodeVar57 ) * vec2<f32>( nodeVar58 ) ) );
		nodeVar64 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar63, nodeVar56.z );
		nodeVar65 = ( nodeVar56.xy + ( vogelDiskSample( 3, 5, nodeVar57 ) * vec2<f32>( nodeVar58 ) ) );
		nodeVar66 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar65, nodeVar56.z );
		nodeVar67 = ( nodeVar56.xy + ( vogelDiskSample( 4, 5, nodeVar57 ) * vec2<f32>( nodeVar58 ) ) );
		nodeVar68 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar67, nodeVar56.z );
		nodeVar53 = ( ( ( ( ( nodeVar60 + nodeVar62 ) + nodeVar64 ) + nodeVar66 ) + nodeVar68 ) * 0.2 );

	} else {

		nodeVar53 = 1.0;

	}

	nodeVar69 = mix( 1.0, nodeVar53, render.nodeUniform27 );
	nodeVar70 = ( vec3<f32>( clamp( nodeVar52, 0.0, 1.0 ) ) * ( render.nodeUniform20 * vec3<f32>( nodeVar69 ) ) );
	nodeVar71 = nodeVar70;
	nodeVar72 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar73 = ( nodeVar71 * nodeVar72 );
	nodeVar74 = ( nodeVar51 + positionViewDirection );
	nodeVar75 = normalize( nodeVar74 );
	nodeVar76 = dot( positionViewDirection, nodeVar75 );
	nodeVar77 = clamp( nodeVar76, 0.0, 1.0 );
	nodeVar78 = exp2( ( ( ( nodeVar77 * -5.55473 ) - 6.98316 ) * nodeVar77 ) );
	nodeVar79 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar78 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar78 ) ) );
	nodeVar80 = ( vec3<f32>( 1.0 ) - nodeVar79 );
	nodeVar81 = nodeVar80;
	nodeVar82 = ( nodeVar73 * nodeVar81 );
	nodeVar83 = ( directDiffuse + nodeVar82 );
	directDiffuse = nodeVar83;
	nodeVar84 = normalize( ( nodeVar51 + positionViewDirection ) );
	nodeVar85 = clamp( dot( positionViewDirection, nodeVar84 ), 0.0, 1.0 );
	nodeVar86 = exp2( ( ( ( nodeVar85 * -5.55473 ) - 6.98316 ) * nodeVar85 ) );
	nodeVar87 = ( Roughness * Roughness );
	nodeVar88 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar86 ) ) ) + vec3<f32>( ( 1.0 * nodeVar86 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar87, clamp( dot( normalView, nodeVar51 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar87, clamp( dot( normalView, nodeVar84 ), 0.0, 1.0 ) ) ) );
	nodeVar89 = ( nodeVar71 * nodeVar88 );
	nodeVar90 = ( nodeVar89 * multiScatteringCompensation );
	nodeVar91 = ( directSpecular + nodeVar90 );
	directSpecular = nodeVar91;
	nodeVar92 = ( render.nodeUniform28 - v_positionView );
	nodeVar93 = normalize( nodeVar92 );
	nodeVar94 = dot( normalView, nodeVar93 );

	if ( ( render.nodeUniform30 > 0.0 ) ) {

		nodeVar96 = length( nodeVar92 );
		nodeVar97 = ( nodeVar96 / render.nodeUniform30 );
		nodeVar98 = clamp( ( 1.0 - ( ( ( nodeVar97 * nodeVar97 ) * nodeVar97 ) * nodeVar97 ) ), 0.0, 1.0 );
		nodeVar95 = ( ( 1.0 / max( pow( nodeVar96, render.nodeUniform31 ), 0.01 ) ) * ( nodeVar98 * nodeVar98 ) );

	} else {

		nodeVar95 = ( 1.0 / max( pow( length( nodeVar92 ), render.nodeUniform31 ), 0.01 ) );

	}

	nodeVar99 = ( render.nodeUniform29 * vec3<f32>( nodeVar95 ) );
	nodeVar100 = ( vec3<f32>( clamp( nodeVar94, 0.0, 1.0 ) ) * nodeVar99 );
	nodeVar101 = nodeVar100;
	nodeVar102 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar103 = ( nodeVar101 * nodeVar102 );
	nodeVar104 = ( nodeVar93 + positionViewDirection );
	nodeVar105 = normalize( nodeVar104 );
	nodeVar106 = dot( positionViewDirection, nodeVar105 );
	nodeVar107 = clamp( nodeVar106, 0.0, 1.0 );
	nodeVar108 = exp2( ( ( ( nodeVar107 * -5.55473 ) - 6.98316 ) * nodeVar107 ) );
	nodeVar109 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar108 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar108 ) ) );
	nodeVar110 = ( vec3<f32>( 1.0 ) - nodeVar109 );
	nodeVar111 = nodeVar110;
	nodeVar112 = ( nodeVar103 * nodeVar111 );
	nodeVar113 = ( directDiffuse + nodeVar112 );
	directDiffuse = nodeVar113;
	nodeVar114 = normalize( ( nodeVar93 + positionViewDirection ) );
	nodeVar115 = clamp( dot( positionViewDirection, nodeVar114 ), 0.0, 1.0 );
	nodeVar116 = exp2( ( ( ( nodeVar115 * -5.55473 ) - 6.98316 ) * nodeVar115 ) );
	nodeVar117 = ( Roughness * Roughness );
	nodeVar118 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar116 ) ) ) + vec3<f32>( ( 1.0 * nodeVar116 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar117, clamp( dot( normalView, nodeVar93 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar117, clamp( dot( normalView, nodeVar114 ), 0.0, 1.0 ) ) ) );
	nodeVar119 = ( nodeVar101 * nodeVar118 );
	nodeVar120 = ( nodeVar119 * multiScatteringCompensation );
	nodeVar121 = ( directSpecular + nodeVar120 );
	directSpecular = nodeVar121;
	nodeVar122 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar123 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar124 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar125 = ( SpecularF90 * dfg.y );
	nodeVar126 = ( nodeVar124 + vec3<f32>( nodeVar125 ) );
	nodeVar127 = ( nodeVar122 + nodeVar126 );
	nodeVar122 = nodeVar127;
	nodeVar128 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar129 = nodeVar128;
	nodeVar130 = ( nodeVar129 * vec3<f32>( 0.047619 ) );
	nodeVar131 = ( SpecularColor + nodeVar130 );
	nodeVar132 = ( nodeVar126 * nodeVar131 );
	nodeVar133 = ( dfg.x + dfg.y );
	nodeVar134 = ( 1.0 - nodeVar133 );
	nodeVar135 = nodeVar134;
	nodeVar136 = ( vec3<f32>( nodeVar135 ) * nodeVar131 );
	nodeVar137 = ( vec3<f32>( 1.0 ) - nodeVar136 );
	nodeVar138 = nodeVar137;
	nodeVar139 = ( nodeVar132 / nodeVar138 );
	nodeVar140 = ( nodeVar139 * vec3<f32>( nodeVar135 ) );
	nodeVar141 = ( nodeVar123 + nodeVar140 );
	nodeVar123 = nodeVar141;
	nodeVar142 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar143 = ( irradiance * nodeVar142 );
	nodeVar144 = ( nodeVar122 + nodeVar123 );
	nodeVar145 = ( vec3<f32>( 1.0 ) - nodeVar144 );
	nodeVar146 = nodeVar145;
	nodeVar147 = ( nodeVar143 * nodeVar146 );
	nodeVar148 = nodeVar147;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar149 = ( indirectDiffuse + nodeVar148 );
	indirectDiffuse = nodeVar149;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar150 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar151 = ( SpecularF90 * dfg.y );
	nodeVar152 = ( nodeVar150 + vec3<f32>( nodeVar151 ) );
	nodeVar153 = ( singleScatteringDielectric + nodeVar152 );
	singleScatteringDielectric = nodeVar153;
	nodeVar154 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar155 = nodeVar154;
	nodeVar156 = ( nodeVar155 * vec3<f32>( 0.047619 ) );
	nodeVar157 = ( SpecularColor + nodeVar156 );
	nodeVar158 = ( nodeVar152 * nodeVar157 );
	nodeVar159 = ( dfg.x + dfg.y );
	nodeVar160 = ( 1.0 - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( vec3<f32>( nodeVar161 ) * nodeVar157 );
	nodeVar163 = ( vec3<f32>( 1.0 ) - nodeVar162 );
	nodeVar164 = nodeVar163;
	nodeVar165 = ( nodeVar158 / nodeVar164 );
	nodeVar166 = ( nodeVar165 * vec3<f32>( nodeVar161 ) );
	nodeVar167 = ( multiScatteringDielectric + nodeVar166 );
	multiScatteringDielectric = nodeVar167;
	nodeVar168 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar169 = ( SpecularF90 * dfg.y );
	nodeVar170 = ( nodeVar168 + vec3<f32>( nodeVar169 ) );
	nodeVar171 = ( singleScatteringMetallic + nodeVar170 );
	singleScatteringMetallic = nodeVar171;
	nodeVar172 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar173 = nodeVar172;
	nodeVar174 = ( nodeVar173 * vec3<f32>( 0.047619 ) );
	nodeVar175 = ( DiffuseColor.xyz + nodeVar174 );
	nodeVar176 = ( nodeVar170 * nodeVar175 );
	nodeVar177 = ( dfg.x + dfg.y );
	nodeVar178 = ( 1.0 - nodeVar177 );
	nodeVar179 = nodeVar178;
	nodeVar180 = ( vec3<f32>( nodeVar179 ) * nodeVar175 );
	nodeVar181 = ( vec3<f32>( 1.0 ) - nodeVar180 );
	nodeVar182 = nodeVar181;
	nodeVar183 = ( nodeVar176 / nodeVar182 );
	nodeVar184 = ( nodeVar183 * vec3<f32>( nodeVar179 ) );
	nodeVar185 = ( multiScatteringMetallic + nodeVar184 );
	multiScatteringMetallic = nodeVar185;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar186 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar187 = ( radiance * nodeVar186 );
	nodeVar188 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar189 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar190 = ( nodeVar188 * nodeVar189 );
	nodeVar191 = ( nodeVar187 + nodeVar190 );
	nodeVar192 = nodeVar191;
	nodeVar193 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar194 = ( vec3<f32>( 1.0 ) - nodeVar193 );
	nodeVar195 = nodeVar194;
	nodeVar196 = ( DiffuseContribution * nodeVar195 );
	nodeVar197 = ( nodeVar196 * nodeVar189 );
	nodeVar198 = nodeVar197;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar199 = ( indirectSpecular + nodeVar192 );
	indirectSpecular = nodeVar199;
	nodeVar200 = ( indirectDiffuse + nodeVar198 );
	indirectDiffuse = nodeVar200;
	ambientOcclusion = 1.0;
	nodeVar201 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar201;
	nodeVar202 = dot( normalView, positionViewDirection );
	nodeVar203 = ( clamp( nodeVar202, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar204 = ( Roughness * -16.0 );
	nodeVar205 = ( 1.0 - nodeVar204 );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( - nodeVar206 );
	nodeVar208 = exp2( nodeVar207 );
	nodeVar209 = pow( nodeVar203, nodeVar208 );
	nodeVar210 = ( 1.0 - nodeVar209 );
	nodeVar211 = nodeVar210;
	nodeVar212 = ( ambientOcclusion - nodeVar211 );
	nodeVar213 = ( indirectSpecular * vec3<f32>( clamp( nodeVar212, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar213;
	nodeVar214 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar214;
	nodeVar215 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar215;
	nodeVar216 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar216;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar217 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar218 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform32, object.nodeUniform33, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform35 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform36 * object.nodeUniform36 ) * nodeVar217 ) * nodeVar217 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar218;

	// result

	output.color = nodeVar218;

	return output;

}
