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

struct objectStruct {
	nodeUniform0 : vec3<f32>,
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform6 : vec3<f32>,
	nodeUniform7 : f32,
	nodeUniform9 : mat4x4<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : f32
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
	nodeUniform21 : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	cameraPosition : vec3<f32>
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
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
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
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : f32;
var<private> nodeVar196 : vec4<f32>;

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




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionViewDirection : vec3<f32>,
	@location( 3 ) v_positionWorld : vec3<f32> ) -> OutputStruct {

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
	nodeVar48 = ( vec3<f32>( clamp( nodeVar47, 0.0, 1.0 ) ) * render.nodeUniform19 );
	nodeVar49 = nodeVar48;
	nodeVar50 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar51 = ( nodeVar49 * nodeVar50 );
	nodeVar52 = ( nodeVar46 + positionViewDirection );
	nodeVar53 = normalize( nodeVar52 );
	nodeVar54 = dot( positionViewDirection, nodeVar53 );
	nodeVar55 = clamp( nodeVar54, 0.0, 1.0 );
	nodeVar56 = exp2( ( ( ( nodeVar55 * -5.55473 ) - 6.98316 ) * nodeVar55 ) );
	nodeVar57 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar56 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar56 ) ) );
	nodeVar58 = ( vec3<f32>( 1.0 ) - nodeVar57 );
	nodeVar59 = nodeVar58;
	nodeVar60 = ( nodeVar51 * nodeVar59 );
	nodeVar61 = ( directDiffuse + nodeVar60 );
	directDiffuse = nodeVar61;
	nodeVar62 = normalize( ( nodeVar46 + positionViewDirection ) );
	nodeVar63 = clamp( dot( positionViewDirection, nodeVar62 ), 0.0, 1.0 );
	nodeVar64 = exp2( ( ( ( nodeVar63 * -5.55473 ) - 6.98316 ) * nodeVar63 ) );
	nodeVar65 = ( Roughness * Roughness );
	nodeVar66 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar64 ) ) ) + vec3<f32>( ( 1.0 * nodeVar64 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar65, clamp( dot( normalView, nodeVar46 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar65, clamp( dot( normalView, nodeVar62 ), 0.0, 1.0 ) ) ) );
	nodeVar67 = ( nodeVar49 * nodeVar66 );
	nodeVar68 = ( nodeVar67 * multiScatteringCompensation );
	nodeVar69 = ( directSpecular + nodeVar68 );
	directSpecular = nodeVar69;
	nodeVar70 = ( render.nodeUniform20 - v_positionView );
	nodeVar71 = normalize( nodeVar70 );
	nodeVar72 = dot( normalView, nodeVar71 );

	if ( ( render.nodeUniform22 > 0.0 ) ) {

		nodeVar74 = length( nodeVar70 );
		nodeVar75 = ( nodeVar74 / render.nodeUniform22 );
		nodeVar76 = clamp( ( 1.0 - ( ( ( nodeVar75 * nodeVar75 ) * nodeVar75 ) * nodeVar75 ) ), 0.0, 1.0 );
		nodeVar73 = ( ( 1.0 / max( pow( nodeVar74, render.nodeUniform23 ), 0.01 ) ) * ( nodeVar76 * nodeVar76 ) );

	} else {

		nodeVar73 = ( 1.0 / max( pow( length( nodeVar70 ), render.nodeUniform23 ), 0.01 ) );

	}

	nodeVar77 = ( render.nodeUniform21 * vec3<f32>( nodeVar73 ) );
	nodeVar78 = ( vec3<f32>( clamp( nodeVar72, 0.0, 1.0 ) ) * nodeVar77 );
	nodeVar79 = nodeVar78;
	nodeVar80 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar81 = ( nodeVar79 * nodeVar80 );
	nodeVar82 = ( nodeVar71 + positionViewDirection );
	nodeVar83 = normalize( nodeVar82 );
	nodeVar84 = dot( positionViewDirection, nodeVar83 );
	nodeVar85 = clamp( nodeVar84, 0.0, 1.0 );
	nodeVar86 = exp2( ( ( ( nodeVar85 * -5.55473 ) - 6.98316 ) * nodeVar85 ) );
	nodeVar87 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar86 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar86 ) ) );
	nodeVar88 = ( vec3<f32>( 1.0 ) - nodeVar87 );
	nodeVar89 = nodeVar88;
	nodeVar90 = ( nodeVar81 * nodeVar89 );
	nodeVar91 = ( directDiffuse + nodeVar90 );
	directDiffuse = nodeVar91;
	nodeVar92 = normalize( ( nodeVar71 + positionViewDirection ) );
	nodeVar93 = clamp( dot( positionViewDirection, nodeVar92 ), 0.0, 1.0 );
	nodeVar94 = exp2( ( ( ( nodeVar93 * -5.55473 ) - 6.98316 ) * nodeVar93 ) );
	nodeVar95 = ( Roughness * Roughness );
	nodeVar96 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar94 ) ) ) + vec3<f32>( ( 1.0 * nodeVar94 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar95, clamp( dot( normalView, nodeVar71 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar95, clamp( dot( normalView, nodeVar92 ), 0.0, 1.0 ) ) ) );
	nodeVar97 = ( nodeVar79 * nodeVar96 );
	nodeVar98 = ( nodeVar97 * multiScatteringCompensation );
	nodeVar99 = ( directSpecular + nodeVar98 );
	directSpecular = nodeVar99;
	nodeVar100 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar101 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar102 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar103 = ( SpecularF90 * dfg.y );
	nodeVar104 = ( nodeVar102 + vec3<f32>( nodeVar103 ) );
	nodeVar105 = ( nodeVar100 + nodeVar104 );
	nodeVar100 = nodeVar105;
	nodeVar106 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar107 = nodeVar106;
	nodeVar108 = ( nodeVar107 * vec3<f32>( 0.047619 ) );
	nodeVar109 = ( SpecularColor + nodeVar108 );
	nodeVar110 = ( nodeVar104 * nodeVar109 );
	nodeVar111 = ( dfg.x + dfg.y );
	nodeVar112 = ( 1.0 - nodeVar111 );
	nodeVar113 = nodeVar112;
	nodeVar114 = ( vec3<f32>( nodeVar113 ) * nodeVar109 );
	nodeVar115 = ( vec3<f32>( 1.0 ) - nodeVar114 );
	nodeVar116 = nodeVar115;
	nodeVar117 = ( nodeVar110 / nodeVar116 );
	nodeVar118 = ( nodeVar117 * vec3<f32>( nodeVar113 ) );
	nodeVar119 = ( nodeVar101 + nodeVar118 );
	nodeVar101 = nodeVar119;
	nodeVar120 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar121 = ( irradiance * nodeVar120 );
	nodeVar122 = ( nodeVar100 + nodeVar101 );
	nodeVar123 = ( vec3<f32>( 1.0 ) - nodeVar122 );
	nodeVar124 = nodeVar123;
	nodeVar125 = ( nodeVar121 * nodeVar124 );
	nodeVar126 = nodeVar125;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar127 = ( indirectDiffuse + nodeVar126 );
	indirectDiffuse = nodeVar127;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar128 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar129 = ( SpecularF90 * dfg.y );
	nodeVar130 = ( nodeVar128 + vec3<f32>( nodeVar129 ) );
	nodeVar131 = ( singleScatteringDielectric + nodeVar130 );
	singleScatteringDielectric = nodeVar131;
	nodeVar132 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar133 = nodeVar132;
	nodeVar134 = ( nodeVar133 * vec3<f32>( 0.047619 ) );
	nodeVar135 = ( SpecularColor + nodeVar134 );
	nodeVar136 = ( nodeVar130 * nodeVar135 );
	nodeVar137 = ( dfg.x + dfg.y );
	nodeVar138 = ( 1.0 - nodeVar137 );
	nodeVar139 = nodeVar138;
	nodeVar140 = ( vec3<f32>( nodeVar139 ) * nodeVar135 );
	nodeVar141 = ( vec3<f32>( 1.0 ) - nodeVar140 );
	nodeVar142 = nodeVar141;
	nodeVar143 = ( nodeVar136 / nodeVar142 );
	nodeVar144 = ( nodeVar143 * vec3<f32>( nodeVar139 ) );
	nodeVar145 = ( multiScatteringDielectric + nodeVar144 );
	multiScatteringDielectric = nodeVar145;
	nodeVar146 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar147 = ( SpecularF90 * dfg.y );
	nodeVar148 = ( nodeVar146 + vec3<f32>( nodeVar147 ) );
	nodeVar149 = ( singleScatteringMetallic + nodeVar148 );
	singleScatteringMetallic = nodeVar149;
	nodeVar150 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar151 = nodeVar150;
	nodeVar152 = ( nodeVar151 * vec3<f32>( 0.047619 ) );
	nodeVar153 = ( DiffuseColor.xyz + nodeVar152 );
	nodeVar154 = ( nodeVar148 * nodeVar153 );
	nodeVar155 = ( dfg.x + dfg.y );
	nodeVar156 = ( 1.0 - nodeVar155 );
	nodeVar157 = nodeVar156;
	nodeVar158 = ( vec3<f32>( nodeVar157 ) * nodeVar153 );
	nodeVar159 = ( vec3<f32>( 1.0 ) - nodeVar158 );
	nodeVar160 = nodeVar159;
	nodeVar161 = ( nodeVar154 / nodeVar160 );
	nodeVar162 = ( nodeVar161 * vec3<f32>( nodeVar157 ) );
	nodeVar163 = ( multiScatteringMetallic + nodeVar162 );
	multiScatteringMetallic = nodeVar163;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar164 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar165 = ( radiance * nodeVar164 );
	nodeVar166 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar167 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar168 = ( nodeVar166 * nodeVar167 );
	nodeVar169 = ( nodeVar165 + nodeVar168 );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar172 = ( vec3<f32>( 1.0 ) - nodeVar171 );
	nodeVar173 = nodeVar172;
	nodeVar174 = ( DiffuseContribution * nodeVar173 );
	nodeVar175 = ( nodeVar174 * nodeVar167 );
	nodeVar176 = nodeVar175;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar177 = ( indirectSpecular + nodeVar170 );
	indirectSpecular = nodeVar177;
	nodeVar178 = ( indirectDiffuse + nodeVar176 );
	indirectDiffuse = nodeVar178;
	ambientOcclusion = 1.0;
	nodeVar179 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar179;
	nodeVar180 = dot( normalView, positionViewDirection );
	nodeVar181 = ( clamp( nodeVar180, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar182 = ( Roughness * -16.0 );
	nodeVar183 = ( 1.0 - nodeVar182 );
	nodeVar184 = nodeVar183;
	nodeVar185 = ( - nodeVar184 );
	nodeVar186 = exp2( nodeVar185 );
	nodeVar187 = pow( nodeVar181, nodeVar186 );
	nodeVar188 = ( 1.0 - nodeVar187 );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( ambientOcclusion - nodeVar189 );
	nodeVar191 = ( indirectSpecular * vec3<f32>( clamp( nodeVar190, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar191;
	nodeVar192 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar192;
	nodeVar193 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar193;
	nodeVar194 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar194;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar195 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar196 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform24, object.nodeUniform25, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform27 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform28 * object.nodeUniform28 ) * nodeVar195 ) * nodeVar195 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar196;

	// result

	output.color = nodeVar196;

	return output;

}
